import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import AdminHeader from '../../components/AdminHeader';
import FilterComponent from '../../components/FilterComponent';
import UserList from '../../components/UserList';
import { RequestHelper } from '../../lib/request-helper';
import { UserData } from '../api/users';

/**
 *
 * The User Dashboard of Admin Console. Shows all users that are registered in the system.
 *
 * Route: /admin/users
 *
 */
export default function UserPage({ userData }: { userData: UserData[] }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  let timer: NodeJS.Timeout;

  const [filter, setFilter] = useState({
    hacker: true,
    sponsor: true,
    organizer: true,
    admin: true,
  });

  useEffect(() => {
    setLoading(true);
    setUsers(userData);
    setFilteredUsers([...userData]);
    setLoading(false);
  }, []);

  useEffect(() => {
    timer = setTimeout(() => {
      if (searchQuery !== '') {
        const newFiltered = users.filter(
          ({ user }) => `${user.firstName} ${user.lastName}`.indexOf(searchQuery) !== -1,
        );
        setFilteredUsers(newFiltered);
      }
    }, 750);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const updateFilter = (name: string) => {
    const filterCriteria = {
      ...filter,
      [name]: !filter[name],
    };
    const newFilteredUser = users.filter(({ user }) => {
      for (let category of Object.keys(filterCriteria)) {
        if (filterCriteria[category] && user.permissions.includes(category)) {
          return true;
        }
      }
      return false;
    });
    setFilteredUsers(newFilteredUser);
    setFilter(filterCriteria);
  };

  const sortByName = () => {
    setFilteredUsers((prev) =>
      [...prev].sort((a, b) => {
        const nameA = a.user.firstName + ' ' + a.user.lastName;
        const nameB = b.user.firstName + ' ' + b.user.lastName;
        return nameA.localeCompare(nameB);
      }),
    );
  };

  if (loading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>HackPortal - Admin</title>
        <meta name="description" content="HackPortal's Admin Page" />
      </Head>
      <section id="subheader" className="p-4">
        <AdminHeader />
      </section>
      <div className="top-6 p-4 flex flex-row items-center gap-x-2">
        <h1 className="font-bold text-lg">Search Users</h1>
        <input
          type="text"
          className="rounded-lg px-2 py-1 w-2/5"
          style={{ backgroundColor: '#F2F3FF' }}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
        />
      </div>
      <div className="p-4 flex flex-row w-full">
        <div className="w-full md:w-1/6 lg:w-1/12 flex flex-col gap-y-4">
          <div>
            <h1 className="text-md font-bold text-center">Filters</h1>
            <FilterComponent
              checked={filter['hacker']}
              onCheck={() => {
                updateFilter('hacker');
              }}
              title="Hackers"
            />
            <FilterComponent
              checked={filter['sponsor']}
              onCheck={() => {
                updateFilter('sponsor');
              }}
              title="Sponsors"
            />
            <FilterComponent
              checked={filter['organizer']}
              onCheck={() => {
                updateFilter('organizer');
              }}
              title="Organizers"
            />
            <FilterComponent
              checked={filter['admin']}
              onCheck={() => {
                updateFilter('admin');
              }}
              title="Admin"
            />
          </div>
          <div className="my-4">
            <h1 className="text-md font-bold text-center mb-4">Sort By:</h1>
            <h4
              className="text-md text-center underline cursor-pointer"
              onClick={() => {
                sortByName();
              }}
            >
              Alphabetically
            </h4>
            <h4 className="text-md text-center underline cursor-pointer">User Level</h4>
          </div>
        </div>
        <div className="w-full px-8">
          <UserList users={filteredUsers} />
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const userData = await RequestHelper.get<UserData[]>(
    `${protocol}://${context.req.headers.host}/api/users/`,
    {},
  );
  return {
    props: {
      userData,
    },
  };
};
